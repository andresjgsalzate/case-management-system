import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UpdatePasswordDto, UserFilterDto, UserResponseDto, UserListResponseDto } from "../dto/user.dto";
export declare class UserService {
    private userRepository;
    private roleRepository;
    constructor();
    createUser(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    getUserById(id: string): Promise<UserResponseDto | null>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    deleteUser(id: string): Promise<boolean>;
    changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<boolean>;
    updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<boolean>;
    getUsers(filterDto: UserFilterDto): Promise<UserListResponseDto>;
    toggleUserStatus(id: string): Promise<UserResponseDto>;
    private mapToUserResponse;
}
