// Conserta a biblioteca react-native-vlc-media-player para o Android/React Native novos.
// 1) O build.gradle dela usa "proguard-android.txt", que o Android atual não aceita mais.
// 2) Os comandos de gravar/parar usam uma função antiga que não existe mais no React Native
//    novo. Aqui adicionamos uma propriedade "recordingPath" que liga/desliga a gravação.
// Roda automaticamente a cada build (inclusive no EAS, que reinstala o node_modules).

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withVlcGradleFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const base = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'react-native-vlc-media-player',
        'android',
      );

      // 1) build.gradle
      const gradle = path.join(base, 'build.gradle');
      if (fs.existsSync(gradle)) {
        const antes = fs.readFileSync(gradle, 'utf8');
        const depois = antes.replace(
          /proguard-android\.txt/g,
          'proguard-android-optimize.txt',
        );
        if (depois !== antes) fs.writeFileSync(gradle, depois);
      }

      // 2) propriedade recordingPath no ViewManager
      const manager = path.join(
        base,
        'src/main/java/com/yuanzhou/vlc/vlcplayer/ReactVlcPlayerViewManager.java',
      );
      if (fs.existsSync(manager)) {
        const java = fs.readFileSync(manager, 'utf8');
        if (!java.includes('setRecordingPath')) {
          const ancora =
            '    public void startRecording(final ReactVlcPlayerView videoView, final String recordingPath) {';
          if (java.includes(ancora)) {
            const novo =
              '    @ReactProp(name = PROP_RECORDING_PATH)\n' +
              '    public void setRecordingPath(final ReactVlcPlayerView videoView, @Nullable final String recordingPath) {\n' +
              '        if (recordingPath != null && recordingPath.length() > 0) {\n' +
              '            videoView.startRecording(recordingPath);\n' +
              '        } else {\n' +
              '            videoView.stopRecording();\n' +
              '        }\n' +
              '    }\n\n';
            fs.writeFileSync(manager, java.replace(ancora, novo + ancora));
          } else {
            console.warn('[withVlcGradleFix] trecho do ViewManager não encontrado; gravação não foi liberada.');
          }
        }
      }

      return config;
    },
  ]);
};
