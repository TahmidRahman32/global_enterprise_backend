import { userRole } from "../../generated/enums";


export type IAuthUser = {
   email: string;
   role: userRole;
} | null;
