

// import { userRole } from "@prisma/client";

import { userRole } from "../../../generated/enums";

export type IJWTPayload = {
   email: string;
   role: userRole;
};
