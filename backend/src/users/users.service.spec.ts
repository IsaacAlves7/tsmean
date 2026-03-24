import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepo = (): MockRepo<User> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<MockRepo<User>>(getRepositoryToken(User));
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const dto: CreateUserDto = {
      name: 'João Teste',
      email: 'joao@teste.com',
      password: 'Senha@123',
    };

    it('deve criar um usuário com sucesso', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue({ ...dto, id: 1 });
      repo.save!.mockResolvedValue({ id: 1, name: dto.name, email: dto.email, password: 'hashed' });

      const result = await service.create(dto);

      expect(repo.findOne).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar ConflictException se e-mail já existe', async () => {
      repo.findOne!.mockResolvedValue({ id: 1, email: dto.email });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll()', () => {
    it('deve retornar lista de usuários', async () => {
      const users = [
        { id: 1, name: 'Alice', email: 'alice@test.com' },
        { id: 2, name: 'Bob', email: 'bob@test.com' },
      ];
      repo.find!.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(repo.find).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const user = { id: 1, name: 'Alice', email: 'alice@test.com' };
      repo.findOne!.mockResolvedValue(user);

      const result = await service.findOne(1);
      expect(result).toEqual(user);
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('deve remover o usuário', async () => {
      const user = { id: 1, name: 'Alice', email: 'alice@test.com' };
      repo.findOne!.mockResolvedValue(user);
      repo.remove!.mockResolvedValue(undefined);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(user);
    });
  });
});
