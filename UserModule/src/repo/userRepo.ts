import { create } from "node:domain";
import { prisma } from "../../../src/shared/prisma.js";
import {
  createUserDTO,
  createUserResponse,
  LoginResponse,
  Profile,
  UpdateUserDTO,
  User,
  UsersResponse,
  UserUpdateInfo,
} from "../types/userTypes.js";
export class UserRepo {
  // ADMIN
   getAllUsers=async()=> {
    const userData = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        profile: true,
      },
    });
    return userData;
  }
  //LOGIN
   findUserByEmail=async(email: string)=> {
    const userData = await prisma.user.findUnique({
      where: { email: email },
      include: {
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        profile: {
          select: {
            profilePic: true,
          },
        },
      },
    });
    return userData;
  }

   createUser=async(user: createUserDTO)=> {
    const { email, firstName, lastName, phone, password } = user;
    const newUser = await prisma.user.create({
      data: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password,
        phone: phone,
        profile: {
          create: { profilePic: user.profilePic },
        },
        roles: {
          create: [
            { roleId: 1 }, // connects existing Role by id
          ],
        },
      },
      include: {
        profile: {
          select: {
            profilePic: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return newUser;
  }
   updateUser=async(userId: string, user: UpdateUserDTO) =>{
    const updateUser: UserUpdateInfo | null = await prisma.user.update({
      where: { id: userId },
      data: user,
    });
    return updateUser;
  }
}
