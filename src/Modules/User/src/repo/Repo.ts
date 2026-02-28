import { createUserDTO, UpdateUserDTO } from "../types/userTypes.js";
export interface UserRepo {
  getAllUsers(): any;
  findUserByEmail(email: string): any;
  findUserById(userId: string): any;
  createUser(user: createUserDTO): any;
  updateUser(userId: string, user: UpdateUserDTO): any;
  deactivateUser(userId: string): any;
  // Cart operations
  getCart(userId: string): any;
  addCartItem(userId: string, productVariantId: string, quantity: number): any;
  updateCartItem(
    userId: string,
    productVariantId: string,
    quantity: number,
  ): any;
  removeCartItem(userId: string, productVariantId: string): any;
  clearCart(userId: string): any;
}
