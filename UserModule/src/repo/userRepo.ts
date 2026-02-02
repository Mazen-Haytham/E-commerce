import { create } from "node:domain";
import { prisma } from "../../../src/shared/prisma.js";
import {
  createUserDTO,
  UpdateUserDTO,
  User,
} from "../types/userTypes.js";
export class UserRepo {
  // ADMIN
  getAllUsers = async () => {
    const userData = await prisma.user.findMany({
      select: {
        id: true,
        email:true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        profile: {
          select: {
            profilePic: true,
            loyaltyPoints: true,
            membership: true,
            recommendations: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return userData;
  };
  //LOGIN
  findUserByEmail = async (email: string) => {
    const userData = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        profile: {
          select: {
            profilePic: true,
            loyaltyPoints: true,
            membership: true,
            recommendations: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return userData;
  };

  findUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        profile: {
          select: {
            profilePic: true,
            loyaltyPoints: true,
            membership: true,
            recommendations: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return user;
  };

  createUser = async (user: createUserDTO) => {
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        email: true,
        profile: {
          select: {
            profilePic: true,
            loyaltyPoints: true,
            membership: true,
            recommendations: true,
          },
        },
        roles: {
          select: {
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
  };
  updateUser = async (
    userId: string,
    user: UpdateUserDTO,
  ): Promise<User | null> => {
    const dto: UpdateUserDTO = {};
    if (user.password) dto.password = user.password;
    if (user.phone) dto.phone = user.phone;
    const updateUser: User = await prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return updateUser;
  };
}
