import {UsersResponse,Profile,User, UpdateUser, createUserResponse, UserWithProfileAndRoles} from "../types/userTypes.js"
export class UserMapper{
    static getAllUsersDTO(userData:UpdateUser[]):UsersResponse[]{
    const users: UsersResponse[] = userData.map((u: any) => {
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
        roles: u.roles.map((r: any) => r.role.name),
      };
      return user;
    });
    return users;
    }
    static createUserDTO(newUser:UserWithProfileAndRoles):createUserResponse{
      return {
      email: newUser.email,
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      profilePic: newUser.profile?.profilePic ?? null,
      roles: newUser.roles.map((r: any) => r.role.name),
    };
    }
}