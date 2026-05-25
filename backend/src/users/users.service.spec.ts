/**
 * users.service.spec.ts
 * Cenários unitários completos do UsersService.
 *
 * Cobertura:
 *   create()   → sucesso, e-mail duplicado, hash de senha
 *   findAll()  → lista vazia, múltiplos usuários, ordenação, campos selecionados
 *   findOne()  → encontrado, não encontrado, campo senha excluído
 *   update()   → parcial, nova senha, sem senha, isActive, não encontrado
 *   remove()   → sucesso, não encontrado
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';

import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

type MockRepo = Partial<Record<keyof Repository<User>, jest.Mock>>;

const mockRepository = (): MockRepo => ({
  findOne: jest.fn(),
  find:    jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
  remove:  jest.fn(),
});

const sha256 = (v: string) =>
  crypto.createHash('sha256').update(v).digest('hex');

const makeUser = (overrides: Partial<User> = {}): User => ({
  id:        1,
  name:      'Alice Tester',
  email:     'alice@tester.com',
  password:  sha256('Senha@123'),
  isActive:  true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo    = module.get<MockRepo>(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ── Instanciação ─────────────────────────────────────────────────────────
  it('cenário 01 — serviço deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ── create() ─────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto: CreateUserDto = {
      name:     'Alice Tester',
      email:    'alice@tester.com',
      password: 'Senha@123',
    };

    it('cenário 02 — cria usuário com sucesso e omite a senha no retorno', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: 1, name: dto.name, email: dto.email });
    });

    it('cenário 03 — armazena senha como hash SHA-256, não em texto plano', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      await service.create(dto);

      const arg = repo.create!.mock.calls[0][0];
      expect(arg.password).toBe(sha256(dto.password));
      expect(arg.password).not.toBe(dto.password);
    });

    it('cenário 04 — lança ConflictException se e-mail já cadastrado', async () => {
      repo.findOne!.mockResolvedValue(makeUser());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        `E-mail '${dto.email}' já está em uso`,
      );
    });

    it('cenário 05 — não chama save() quando e-mail está duplicado', async () => {
      repo.findOne!.mockResolvedValue(makeUser());

      await expect(service.create(dto)).rejects.toThrow();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('cenário 06 — verifica existência usando o e-mail exato do DTO', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      await service.create(dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
    });

    it('cenário 07 — e-mails distintos não causam conflito entre si', async () => {
      const dto2 = { ...dto, email: 'bob@tester.com' };
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser({ id: 2, email: 'bob@tester.com' }));
      repo.save!.mockResolvedValue(makeUser({ id: 2, email: 'bob@tester.com' }));

      const result = await service.create(dto2);

      expect(result.email).toBe('bob@tester.com');
    });

    it('cenário 08 — senhas iguais geram o mesmo hash (determinístico)', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      await service.create(dto);
      const hash1 = repo.create!.mock.calls[0][0].password;
      jest.clearAllMocks();

      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      await service.create(dto);
      const hash2 = repo.create!.mock.calls[0][0].password;

      expect(hash1).toBe(hash2);
    });
  });

  // ── findAll() ────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('cenário 09 — retorna array vazio quando não há usuários', async () => {
      repo.find!.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });

    it('cenário 10 — retorna todos os usuários cadastrados', async () => {
      const users = [
        makeUser(),
        makeUser({ id: 2, email: 'bob@tester.com' }),
      ];
      repo.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.email)).toContain('alice@tester.com');
      expect(result.map((u) => u.email)).toContain('bob@tester.com');
    });

    it('cenário 11 — exclui "password" da projeção de campos', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findAll();

      const { select } = repo.find!.mock.calls[0][0] as any;
      expect(select).not.toContain('password');
    });

    it('cenário 12 — ordena por createdAt DESC', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findAll();

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });

    it('cenário 13 — retorna tanto usuários ativos quanto inativos (sem filtro)', async () => {
      repo.find!.mockResolvedValue([
        makeUser({ isActive: true }),
        makeUser({ id: 2, isActive: false }),
      ]);

      const result = await service.findAll();

      expect(result.filter((u) => u.isActive)).toHaveLength(1);
      expect(result.filter((u) => !u.isActive)).toHaveLength(1);
    });
  });

  // ── findOne() ────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('cenário 14 — retorna o usuário quando ID existe', async () => {
      const user = makeUser();
      repo.findOne!.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
    });

    it('cenário 15 — lança NotFoundException quando ID não existe', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Usuário com ID 999 não encontrado',
      );
    });

    it('cenário 16 — busca pelo ID exato fornecido', async () => {
      repo.findOne!.mockResolvedValue(makeUser({ id: 42 }));

      await service.findOne(42);

      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 42 } }),
      );
    });

    it('cenário 17 — exclui "password" da projeção de campos', async () => {
      repo.findOne!.mockResolvedValue(makeUser());

      await service.findOne(1);

      const { select } = repo.findOne!.mock.calls[0][0] as any;
      expect(select).not.toContain('password');
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('cenário 18 — atualiza nome mantendo e-mail intacto', async () => {
      const user = makeUser();
      repo.findOne!.mockResolvedValue(user);
      repo.save!.mockResolvedValue({ ...user, name: 'Novo Nome' });

      const result = await service.update(1, { name: 'Novo Nome' });

      expect(result.name).toBe('Novo Nome');
      expect(result.email).toBe(user.email);
    });

    it('cenário 19 — faz hash da nova senha ao atualizar', async () => {
      repo.findOne!.mockResolvedValue(makeUser());
      repo.save!.mockResolvedValue(makeUser());

      await service.update(1, { password: 'NovaSenha@456' });

      const saved = repo.save!.mock.calls[0][0];
      expect(saved.password).toBe(sha256('NovaSenha@456'));
      expect(saved.password).not.toBe('NovaSenha@456');
    });

    it('cenário 20 — não altera senha se campo password ausente no DTO', async () => {
      const user     = makeUser();
      const original = user.password;
      repo.findOne!.mockResolvedValue(user);
      repo.save!.mockResolvedValue(user);

      await service.update(1, { name: 'Sem trocar senha' });

      expect(repo.save!.mock.calls[0][0].password).toBe(original);
    });

    it('cenário 21 — alterna isActive de true para false', async () => {
      repo.findOne!.mockResolvedValue(makeUser({ isActive: true }));
      repo.save!.mockResolvedValue(makeUser({ isActive: false }));

      const result = await service.update(1, { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('cenário 22 — atualiza múltiplos campos simultaneamente', async () => {
      const user = makeUser();
      const dto: UpdateUserDto = {
        name:     'Multi Update',
        email:    'multi@tester.com',
        isActive: false,
      };
      repo.findOne!.mockResolvedValue(user);
      repo.save!.mockResolvedValue({ ...user, ...dto });

      const result = await service.update(1, dto);

      expect(result.name).toBe('Multi Update');
      expect(result.email).toBe('multi@tester.com');
      expect(result.isActive).toBe(false);
    });

    it('cenário 23 — lança NotFoundException ao atualizar ID inexistente', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove() ─────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('cenário 24 — remove usuário com sucesso e retorna undefined', async () => {
      repo.findOne!.mockResolvedValue(makeUser());
      repo.remove!.mockResolvedValue(undefined);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(makeUser());
    });

    it('cenário 25 — lança NotFoundException ao remover ID inexistente', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
