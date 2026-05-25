/**
 * users.controller.spec.ts
 * Cenários unitários do UsersController.
 *
 * Cobertura:
 *   POST   /users     → create()  — delega ao service, retorna 201
 *   GET    /users     → findAll() — retorna lista, lista vazia
 *   GET    /users/:id → findOne() — encontrado, não encontrado, param parse
 *   PATCH  /users/:id → update()  — atualização parcial, ID inválido
 *   DELETE /users/:id → remove()  — remoção, not found
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): Omit<User, 'password'> => ({
  id:        1,
  name:      'Alice Tester',
  email:     'alice@tester.com',
  isActive:  true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const mockUsersService = () => ({
  create:  jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update:  jest.fn(),
  remove:  jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof mockUsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useFactory: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service    = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Instanciação ─────────────────────────────────────────────────────────
  it('cenário 01 — controller deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ── create() ─────────────────────────────────────────────────────────────
  describe('create() — POST /users', () => {
    const dto: CreateUserDto = {
      name:     'Alice Tester',
      email:    'alice@tester.com',
      password: 'Senha@123',
    };

    it('cenário 02 — delega criação ao service e retorna o resultado', async () => {
      const created = makeUser();
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });

    it('cenário 03 — propaga ConflictException do service', async () => {
      service.create.mockRejectedValue(
        new ConflictException(`E-mail '${dto.email}' já está em uso`),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });

    it('cenário 04 — passa o DTO exato ao service sem modificação', async () => {
      service.create.mockResolvedValue(makeUser());

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name:  dto.name,
          email: dto.email,
        }),
      );
    });
  });

  // ── findAll() ────────────────────────────────────────────────────────────
  describe('findAll() — GET /users', () => {
    it('cenário 05 — retorna lista de usuários do service', async () => {
      const users = [makeUser(), makeUser({ id: 2, email: 'bob@tester.com' })];
      service.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
    });

    it('cenário 06 — retorna array vazio quando não há usuários', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('cenário 07 — chama service.findAll exatamente uma vez', async () => {
      service.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── findOne() ────────────────────────────────────────────────────────────
  describe('findOne() — GET /users/:id', () => {
    it('cenário 08 — retorna usuário pelo ID correto', async () => {
      const user = makeUser();
      service.findOne.mockResolvedValue(user);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('cenário 09 — propaga NotFoundException do service', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Usuário com ID 999 não encontrado'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('cenário 10 — encaminha o ID numérico ao service (sem string)', async () => {
      service.findOne.mockResolvedValue(makeUser({ id: 7 }));

      await controller.findOne(7);

      const arg = service.findOne.mock.calls[0][0];
      expect(typeof arg).toBe('number');
      expect(arg).toBe(7);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────
  describe('update() — PATCH /users/:id', () => {
    it('cenário 11 — atualiza usuário e retorna resultado do service', async () => {
      const dto: UpdateUserDto = { name: 'Atualizado' };
      const updated = makeUser({ name: 'Atualizado' });
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result.name).toBe('Atualizado');
    });

    it('cenário 12 — propaga NotFoundException ao atualizar ID inexistente', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('Usuário com ID 999 não encontrado'),
      );

      await expect(controller.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cenário 13 — aceita DTO parcial (apenas isActive)', async () => {
      const dto: UpdateUserDto = { isActive: false };
      service.update.mockResolvedValue(makeUser({ isActive: false }));

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result.isActive).toBe(false);
    });

    it('cenário 14 — passa ID e DTO corretos ao service', async () => {
      const dto: UpdateUserDto = { name: 'Novo', email: 'novo@tester.com' };
      service.update.mockResolvedValue(makeUser());

      await controller.update(42, dto);

      expect(service.update).toHaveBeenCalledWith(42, dto);
    });
  });

  // ── remove() ─────────────────────────────────────────────────────────────
  describe('remove() — DELETE /users/:id', () => {
    it('cenário 15 — remove usuário com sucesso (retorna undefined)', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it('cenário 16 — propaga NotFoundException ao remover ID inexistente', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Usuário com ID 999 não encontrado'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('cenário 17 — encaminha o ID numérico correto ao service', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(55);

      expect(service.remove).toHaveBeenCalledWith(55);
    });
  });

  // ── Sequência de operações ────────────────────────────────────────────────
  describe('fluxo CRUD completo', () => {
    it('cenário 18 — cria, busca, atualiza e remove o mesmo usuário', async () => {
      const dto: CreateUserDto = {
        name: 'Fluxo', email: 'fluxo@tester.com', password: 'Senha@123',
      };

      service.create.mockResolvedValue(makeUser({ name: 'Fluxo', email: 'fluxo@tester.com' }));
      const created = await controller.create(dto);
      expect(created.name).toBe('Fluxo');

      service.findOne.mockResolvedValue(created);
      const found = await controller.findOne(created.id);
      expect(found).toEqual(created);

      service.update.mockResolvedValue({ ...created, name: 'Fluxo Atualizado' });
      const updated = await controller.update(created.id, { name: 'Fluxo Atualizado' });
      expect(updated.name).toBe('Fluxo Atualizado');

      service.remove.mockResolvedValue(undefined);
      await expect(controller.remove(created.id)).resolves.toBeUndefined();
    });

    it('cenário 19 — não chama findAll mais de uma vez por requisição', async () => {
      service.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('cenário 20 — lida com múltiplas chamadas independentes ao findOne', async () => {
      const user1 = makeUser({ id: 1 });
      const user2 = makeUser({ id: 2, email: 'b@b.com' });

      service.findOne
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const r1 = await controller.findOne(1);
      const r2 = await controller.findOne(2);

      expect(r1.id).toBe(1);
      expect(r2.id).toBe(2);
      expect(service.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
