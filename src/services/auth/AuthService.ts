import { User, Role } from '../types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '24h';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // TODO: Implement actual user lookup from database
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  async register(userData: Partial<User>): Promise<User> {
    // TODO: Implement user registration with database
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const user = {
      ...userData,
      password: hashedPassword,
      role: Role.USER,
    } as User;
    
    // TODO: Save user to database
    return user;
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    // TODO: Implement database lookup
    return null;
  }
} 