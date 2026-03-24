import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { User } from './user.model';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService],
    });

    service  = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve estar definido', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() deve fazer GET em /api/users', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', email: 'alice@test.com', isActive: true, createdAt: '', updatedAt: '' },
    ];

    service.getAll().subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('Alice');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('getById() deve fazer GET em /api/users/:id', () => {
    const mockUser: User = {
      id: 1, name: 'Alice', email: 'alice@test.com',
      isActive: true, createdAt: '', updatedAt: '',
    };

    service.getById(1).subscribe((user) => {
      expect(user.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('create() deve fazer POST em /api/users', () => {
    const payload = { name: 'Bob', email: 'bob@test.com', password: 'Senha@123' };

    service.create(payload).subscribe((user) => {
      expect(user.email).toBe('bob@test.com');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 2, ...payload, isActive: true, createdAt: '', updatedAt: '' });
  });

  it('update() deve fazer PATCH em /api/users/:id', () => {
    const payload = { name: 'Bob Atualizado' };

    service.update(2, payload).subscribe((user) => {
      expect(user.name).toBe('Bob Atualizado');
    });

    const req = httpMock.expectOne('/api/users/2');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 2, name: 'Bob Atualizado', email: 'bob@test.com', isActive: true, createdAt: '', updatedAt: '' });
  });

  it('remove() deve fazer DELETE em /api/users/:id', () => {
    service.remove(1).subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
