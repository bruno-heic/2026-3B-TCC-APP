export type SignUpParams = {
  nome: string;
  email: string;
  password: string;
};

export type SignUpResult =
  | { sucess: true; idUsuario: number }
  | { sucess: false; error: string };

export type SignInParams = {
  email: string;
  password: string;
};

export type SignInResult =
  | { sucess: true; idUsuario: number }
  | { sucess: false; error: string };

export type SucessSignUserProps = {
  visible: boolean;
  onAddPet: () => void;
  onDoLater: () => void;
};

export type VerifyPetsResult =
  | { sucess: true; hasPets: boolean }
  | { sucess: false; error: string };

export type PetFormData = {
  nome: string;
  especie: string;
  raca: string;
  dataNascimento: string;
  peso: string;
  imagemUri: string | null;
};

export type CreatePetParams = {
  idUsuario: number;
  nome: string;
  especie: string;
  raca: string;
  dataNascimento: string;
  peso: string;
  imagemUri: string | null;
};

export type CreatePetResult =
  | { sucess: true; idPet: number }
  | { sucess: false; error: string };

export type Pet = {
  id_pet: number;
  nome: string;
  especie: string;
  raca: string;
  data_nascimento: string | null;
  peso: number | null;
  foto_url: string | null;
};
export type GetPetsResult =
  | { sucess: true; pets: Pet[] }
  | { sucess: false; error: string };

export type ResetPasswordResult =
  | { sucess: true }
  | { sucess: false; error: string };

export type VerifyCodeResult =
  | { sucess: true }
  | { sucess: false; error: string };

export type UpdatePasswordResult =
  | { sucess: true }
  | { sucess: false; error: string };
