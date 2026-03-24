import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { UsersService } from '../users.service';
import { User } from '../user.model';

const mockUsers: User[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Bob',   email: 'bob@test.com',   isActive: false, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
];

describe('UsersListComponent', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getAll', 'remove']);
    usersServiceSpy.getAll.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      imports: [UsersListComponent, RouterTestingModule],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar os usuários no ngOnInit', () => {
    expect(usersServiceSpy.getAll).toHaveBeenCalled();
    expect(component.users().length).toBe(2);
  });

  it('deve exibir mensagem de erro se a API falhar', () => {
    usersServiceSpy.getAll.and.returnValue(throwError(() => ({ message: 'Erro de rede' })));
    component.load();
    expect(component.error()).toBe('Erro de rede');
  });

  it('deve remover usuário da lista após exclusão', () => {
    usersServiceSpy.remove.and.returnValue(of(undefined));
    spyOn(window, 'confirm').and.returnValue(true);

    component.delete(mockUsers[0]);
    expect(component.users().length).toBe(1);
    expect(component.users()[0].id).toBe(2);
  });
});
