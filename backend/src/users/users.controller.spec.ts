import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('findAll() deve chamar o service', async () => {
    const lista = [{ id: 1, name: 'Test' }];
    mockUsersService.findAll.mockResolvedValue(lista);

    const result = await controller.findAll();
    expect(result).toEqual(lista);
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });

  it('findOne() deve chamar o service com o ID correto', async () => {
    const user = { id: 1, name: 'Test' };
    mockUsersService.findOne.mockResolvedValue(user);

    const result = await controller.findOne(1);
    expect(result).toEqual(user);
    expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
  });
});
