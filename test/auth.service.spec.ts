import { CoreAuthService } from '../src/service';
import { IUserRepository, IHashingService, ITokenService, ILogger } from '../src/interfaces';
import { ConflictError, UnauthorizedError } from '../src/errors';

const mockUserRepository: jest.Mocked<IUserRepository> = {
  findOneByEmail: jest.fn(),
  create: jest.fn(),
};

const mockHashingService: jest.Mocked<IHashingService> = {
  hashPassword: jest.fn(),
  comparePasswords: jest.fn(),
};

const mockTokenService: jest.Mocked<ITokenService> = {
  signAsync: jest.fn(),
};

const mockLogger: jest.Mocked<ILogger> = {
  log: jest.fn(),
  error: jest.fn(),
};

describe('CoreAuthService', () => {
  let service: CoreAuthService;

  const existingUser = {
    _id: 'user_id_123',
    email: 'test@example.com',
    username: 'TestUser',
    passwordHash: 'hashed_password_xyz',
    role: 'USER',
  };
  const token = 'valid_jwt_token_for_test';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CoreAuthService(
      mockUserRepository,
      mockHashingService,
      mockTokenService,
      mockLogger
    );
  });

  describe('register', () => {
    const createUserDto = { email: 'new@example.com', username: 'NewUser' };
    const plainPassword = 'secure_password';

    it('should register a new user and return token', async () => {
      mockUserRepository.findOneByEmail.mockResolvedValue(null);
      mockHashingService.hashPassword.mockResolvedValue('new_hashed_password');
      mockUserRepository.create.mockResolvedValue({ ...existingUser, email: createUserDto.email, _id: 'new_id' });
      mockTokenService.signAsync.mockResolvedValue(token);

      const result = await service.register(createUserDto, plainPassword);

      expect(result.accessToken).toBe(token);
      expect(result.user.email).toBe(createUserDto.email);
      expect(mockHashingService.hashPassword).toHaveBeenCalledWith(plainPassword);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockTokenService.signAsync).toHaveBeenCalled();
    });

    it('should throw ConflictError if email exists', async () => {
      mockUserRepository.findOneByEmail.mockResolvedValue(existingUser);

      await expect(service.register(createUserDto, plainPassword)).rejects.toThrow(ConflictError);
      expect(mockHashingService.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const correctPassword = 'correct_password';
    const wrongPassword = 'wrong_password';

    it('should login successfully and return token', async () => {
      mockUserRepository.findOneByEmail.mockResolvedValue(existingUser);
      mockHashingService.comparePasswords.mockResolvedValue(true);
      mockTokenService.signAsync.mockResolvedValue(token);

      const result = await service.login(existingUser.email, correctPassword);

      expect(result.accessToken).toBe(token);
      expect(result.user._id).toBe(existingUser._id);
      expect(mockHashingService.comparePasswords).toHaveBeenCalledWith(correctPassword, existingUser.passwordHash);
      expect(mockTokenService.signAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user does not exist', async () => {
      mockUserRepository.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(existingUser.email, correctPassword)).rejects.toThrow(UnauthorizedError);
      expect(mockHashingService.comparePasswords).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if password is wrong', async () => {
      mockUserRepository.findOneByEmail.mockResolvedValue(existingUser);
      mockHashingService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(existingUser.email, wrongPassword)).rejects.toThrow(UnauthorizedError);
      expect(mockTokenService.signAsync).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});