import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CONFIG_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const STATUS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
const manager = new BleManager();

const toB64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const fromB64 = (b: string) => Buffer.from(b, "base64").toString("utf8");

export async function pedirPermissoes(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  const permissoes =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const r = await PermissionsAndroid.requestMultiple(permissoes);
  return Object.values(r).every(
    (v) => v === PermissionsAndroid.RESULTS.GRANTED,
  );
}

function procurarColeira(timeoutMs = 15000): Promise<Device> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      manager.stopDeviceScan();
      reject(
        new Error(
          "Coleira não encontrada. Ela está ligada e em modo de pareamento?",
        ),
      );
    }, timeoutMs);

    manager.startDeviceScan([SERVICE_UUID], null, (erro, device) => {
      if (erro) {
        clearTimeout(t);
        reject(erro);
        return;
      }
      if (device) {
        clearTimeout(t);
        manager.stopDeviceScan();
        resolve(device);
      }
    });
  });
}

function enviarConfigWifi(
  d: Device,
  serial: string,
  ssid: string,
  senha: string,
  onStatus: (status: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const FINAIS = [
      "RECONHECIDA",
      "RECUSADA",
      "SEM_RESPOSTA",
      "ERRO_SERIAL",
      "ERRO_WIFI",
    ];
    let terminou = false;

    const encerrar = (acao: () => void) => {
      if (terminou) return;
      terminou = true;
      clearTimeout(timer);
      sub.remove();
      acao();
    };

    const timer = setTimeout(
      () =>
        encerrar(() => reject(new Error("A coleira não respondeu a tempo."))),
      60000,
    );

    const sub = d.monitorCharacteristicForService(
      SERVICE_UUID,
      STATUS_UUID,
      (erro, c) => {
        if (erro) {
          encerrar(() => reject(erro));
          return;
        }
        if (!c?.value) return;
        const status = fromB64(c.value);
        onStatus(status);
        if (FINAIS.includes(status)) encerrar(() => resolve(status));
      },
    );

    setTimeout(() => {
      d.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CONFIG_UUID,
        toB64(`${serial}\n${ssid}\n${senha}`),
      ).catch((e) => encerrar(() => reject(e)));
    }, 400);
  });
}

export async function configurarWifiDaColeira(
  serial: string,
  ssid: string,
  senha: string,
  onStatus: (status: string) => void,
): Promise<string> {
  const achada = await procurarColeira();
  const d = await achada.connect();
  try {
    await d.discoverAllServicesAndCharacteristics();
    return await enviarConfigWifi(
      d,
      serial.trim().toUpperCase(),
      ssid,
      senha,
      onStatus,
    );
  } finally {
    await d.cancelConnection().catch(() => {});
  }
}
