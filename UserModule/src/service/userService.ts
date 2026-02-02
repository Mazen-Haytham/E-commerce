// async getAllUsers(): Promise<UsersResponse[] | null> {
//     const userData = await prisma.user.findMany({
//       include: {
//         roles: {
//           include: {
//             role: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         profile: true,
//       },
//     });
//     if (!userData) return null;
//     const users: UsersResponse[] = userData.map((u) => {
//       const userEntity: User = {
//         id: u.id,
//         email: u.email,
//         firstName: u.firstName,
//         lastName: u.lastName,
//         password: u.password,
//         phone: u.phone,
//       };
//       let userProfile: Profile | undefined;
//       if (u.profile) {
//         userProfile = {
//           userId: u.profile.userId,
//           profilePic: u.profile.profilePic ? u.profile.profilePic : undefined,
//           loyaltyPoints: u.profile.loyaltyPoints
//             ? u.profile.loyaltyPoints
//             : undefined,
//           membership: u.profile.membership ? u.profile.membership : undefined,
//           recommendations: u.profile.recommendations
//             ? u.profile.recommendations
//             : undefined,
//         };
//       }
//       const user: UsersResponse = {
//         user: userEntity,
//         profile: userProfile,
//         roles: u.roles.map((r) => r.role.name),
//       };
//       return user;
//     });
//     return users;
//   }
//------------------------------------------------------------------------

// async findUserByEmail(email: string): Promise<LoginResponse | null> {
//     const userData = await prisma.user.findUnique({
//       where: { email: email },
//       include: {
//         roles: {
//           select: {
//             role: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//       },
//     });
//     if (!userData) return null;
//     const user: LoginResponse = {
//       user: {
//         id: userData.id,
//         email: userData.email,
//         firstName: userData.firstName,
//         lastName: userData.lastName,
//         password: userData.password,
//         phone: userData.phone,
//       },
//       roles: userData.roles.map((r) => r.role.name),
//     };
//     return user;
//   }
import bcrypt from "bcrypt";
import { UserRepo } from "../repo/userRepo.js";
import {
  UsersResponse,
  User,
  createUserResponse,
  createUserDTO,
  UpdateUser,
  UpdateUserDTO,
  UserWithProfileAndRoles,
} from "../types/userTypes.js";
import { AppError } from "../../../src/utils/AppError.js";
import { UserMapper } from "../Dtos/userDtos.js";
export class UserService {
  constructor(private readonly userRepo: UserRepo) {}
  getAllUsers = async (): Promise<UsersResponse[]> => {
    const userData: UserWithProfileAndRoles[] = await this.userRepo.getAllUsers();
    const users = UserMapper.getAllUsersDTO(userData);
    return users;
  };
  createUser = async (
    data: createUserDTO,
  ): Promise<createUserResponse | null> => {
    const user = await this.findUserByEmail(data.email);
    if (user) throw new AppError("User Already Exists With That Email", 409);
    const password = await bcrypt.hash(data.password, 12);
    const newUser:UserWithProfileAndRoles = await this.userRepo.createUser({ ...data, password });
    return UserMapper.createUserDTO(newUser);
  };
  findUserById = async (userId: string) => {
    const user = await this.userRepo.findUserById(userId);
    return user;
  };
  findUserByEmail = async (email: string) => {
    const user = await this.userRepo.findUserByEmail(email);
    return user;
  };
  updateUser = async (userId: string, newData: UpdateUserDTO) => {
    const user = await this.findUserById(userId);
    if (!user) throw new AppError("User Not Found", 404);
    const dto: UpdateUserDTO = {};
    if (newData.password)
      dto.password = await bcrypt.hash(newData.password, 12);
    if (dto.password && user.password === dto.password)
      throw new AppError("This Password already Exists", 400);

    const updateUser: User | null = await this.userRepo.updateUser(userId, dto);
    return updateUser;
  };
}
