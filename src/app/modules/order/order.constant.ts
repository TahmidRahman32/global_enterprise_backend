export interface IOrderPayload {
   name: string;
   email: string;
   phone: string;
   address: string;
   company?: string;
   productId: string; // single product for now
}


export interface IOrderUpdatePayload {
   status: string; // e.g., "PROCESSING", "COMPLETED", "CANCELLED"
   // optionally other updatable fields (name, address, etc.)
}

export interface IOrderFromUpdatePayload {
   phone: string;
   address: string;
   name: string;
}