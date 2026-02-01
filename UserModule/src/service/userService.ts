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
import bcrypt from 'bcrypt'
import { UserRepo } from "../repo/userRepo.js";
import { UsersResponse, User, Profile, createUserResponse, createUserDTO } from "../types/userTypes.js";
export class UserService {
  constructor(private readonly userRepo : UserRepo){}
   getAllUsers=async(): Promise<UsersResponse[] | null> =>{
    const userData = await this.userRepo.getAllUsers();

    const users: UsersResponse[] = userData.map((u:any) => {
      const userEntity: User = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        password: u.password,
        phone: u.phone,
      };
      let userProfile: Profile | undefined;
      if (u.profile) {
        userProfile = {
          userId: u.profile.userId,
          profilePic: u.profile.profilePic ? u.profile.profilePic : undefined,
          loyaltyPoints: u.profile.loyaltyPoints
            ? u.profile.loyaltyPoints
            : undefined,
          membership: u.profile.membership ? u.profile.membership : undefined,
          recommendations: u.profile.recommendations
            ? u.profile.recommendations
            : undefined,
        };
      }
      const user: UsersResponse = {
        user: userEntity,
        profile: userProfile,
        roles: u.roles.map((r:any) => r.role.name),
      };
      return user;
    });
    return users;
  }
   createUser=async(data:createUserDTO):Promise<createUserResponse | null>=>{
    const password=await bcrypt.hash(data.password,12);

    const newUser=await this.userRepo.createUser({...data,password});
    return {
        email:newUser.email,
        id:newUser.id,
        firstName:newUser.firstName,
        lastName:newUser.lastName,
        phone:newUser.phone,
        profilePic:newUser.profile ? newUser.profile.profilePic : null,
        roles:newUser.roles.map((r:any)=>r.role.name
        )
    }
  }

}
