import { UserDataQueryResult } from "../types/userManagementTypes";

// Asegúrate de que todas las funciones devuelvan objetos que cumplan con UserDataQueryResult
// Por ejemplo:
export function exampleFunction(): UserDataQueryResult {
  const result = {}; // Replace with actual result
  return {
    success: true,
    data: result,
    message: "Operación exitosa"
  } as UserDataQueryResult;
}

// ...other functions that return UserDataQueryResult...