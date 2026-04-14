import z from "zod";

const productValidationSchema = z.object({
   name: z.string().min(2, "Name must be at least 2 characters long"),
   description: z.string().min(10, "Description must be at least 10 characters long").optional(),
   price: z.number().positive("Price must be a positive number"),
   category: z.string().min(2, "Category must be at least 2 characters long").optional(),
   brand: z.string().min(2, "Brand must be at least 2 characters long"),
   sku: z.string().min(3, "SKU must be at least 3 characters long").optional(),
   stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
   imageUrl: z.string().url("Image URL must be a valid URL").optional(),
});

export const productValidation = {
   productValidationSchema,
};
