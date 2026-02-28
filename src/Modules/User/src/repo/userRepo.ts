import { create } from "node:domain";
import { prisma } from "../../../../shared/prisma.js";
import { UserRepo } from "../repo/Repo.js";
import { createUserDTO, UpdateUserDTO, User } from "../types/userTypes.js";
export class PrismaUserRepo implements UserRepo {
  // ADMIN
  getAllUsers = async () => {
    const userData = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        deletedAt: true,
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
      where: { email: email, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        password: true,
        phone: true,
        tokenVersion:true,
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
      where: { id: userId, deletedAt: null },
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
  updateUser = async (userId: string, user: UpdateUserDTO) => {
    const dto: UpdateUserDTO = {};
    if (user.password) dto.password = user.password;
    if (user.phone) dto.phone = user.phone;
    dto.profile = user.profile;
    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: dto.password,
        phone: dto.phone,
        profile: dto.profile
          ? {
              update: {
                profilePic: dto.profile.profilePic,
                membership: dto.profile.membership,
                recommendations: dto.profile.recommendations,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        profile: {
          select: {
            profilePic: true,
            membership: true,
            recommendations: true,
          },
        },
      },
    });
    return updateUser;
  };
  deactivateUser = async (userId: string) => {
    const deactivatedUser = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return deactivatedUser;
  };
}
