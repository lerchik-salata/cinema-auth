import type { IUserRepository, IHashingService, ITokenService, ILogger } from './interfaces.ts';
import type { CoreCreateUserDto, CoreAuthResponse } from './types.ts';
import { ConflictError, UnauthorizedError } from './errors.ts';

class CoreAuthService {
  
  constructor(
    private userRepository: IUserRepository, 
    private hashingService: IHashingService,     
    private tokenService: ITokenService,        
    private logger: ILogger,
  ) {}

  async register(createUserDto: CoreCreateUserDto, passwordPlain: string): Promise<CoreAuthResponse> {
    
    if (await this.userRepository.findOneByEmail(createUserDto.email)) {
      this.logger.error(`Registration attempt failed: User ${createUserDto.email} already exists.`, CoreAuthService.name);
      throw new ConflictError("The user already exists");
    }

    const passwordHash = await this.hashingService.hashPassword(passwordPlain);
    
    const newUser = await this.userRepository.create(createUserDto, passwordHash);

    const payload = { sub: newUser._id, username: newUser.username };
    const accessToken = await this.tokenService.signAsync(payload);

    this.logger.log(`User registered successfully: ${newUser.email}`, CoreAuthService.name);

    return {
      accessToken: accessToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      },
    } as CoreAuthResponse;
  }

  async login(email: string, pass: string): Promise<CoreAuthResponse> {
    const user = await this.userRepository.findOneByEmail(email);
    
    if (!user) {
      this.logger.error(`Login failed for email ${email}: User not found.`, CoreAuthService.name);
      throw new UnauthorizedError("Incorrect email or password");
    }
    
    const isPasswordMatching = await this.hashingService.comparePasswords(pass, user.passwordHash);
    
    if (!isPasswordMatching) {
      this.logger.error(`Login failed for user ${email}: Incorrect password.`, CoreAuthService.name);
      throw new UnauthorizedError("Incorrect email or password");
    }
    
    const payload = { sub: user._id, username: user.username };
    const accessToken = await this.tokenService.signAsync(payload);

    this.logger.log(`User logged in successfully: ${email}`, CoreAuthService.name);

    return {
      accessToken: accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    } as CoreAuthResponse;
  }
}

module.exports = { CoreAuthService };