/**
 * create-user.dto.spec.ts
 * Valida as regras de validação do CreateUserDto usando class-validator.
 *
 * Cenários cobertos:
 *   - DTO válido passa sem erros
 *   - name: vazio, ausente, excede 100 chars
 *   - email: inválido, vazio, ausente
 *   - password: curto demais, vazio, ausente
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

// ── Helper ────────────────────────────────────────────────────────────────────
async function validateDto(plain: object) {
  const dto    = plainToInstance(CreateUserDto, plain);
  const errors = await validate(dto);
  return errors;
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('CreateUserDto — validações', () => {
  const valid = {
    name:     'Alice Tester',
    email:    'alice@tester.com',
    password: 'Senha@123',
  };

  it('cenário 01 — DTO válido não gera erros de validação', async () => {
    const errors = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  // ── name ────────────────────────────────────────────────────────────────
  it('cenário 02 — name vazio gera erro IsNotEmpty', async () => {
    const errors = await validateDto({ ...valid, name: '' });
    const names  = errors.map((e) => e.property);
    expect(names).toContain('name');
  });

  it('cenário 03 — name ausente gera erro de validação', async () => {
    const { name: _, ...without } = valid;
    const errors = await validateDto(without);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('cenário 04 — name com 100 caracteres é válido (limite exato)', async () => {
    const errors = await validateDto({ ...valid, name: 'A'.repeat(100) });
    const nameErrors = errors.filter((e) => e.property === 'name');
    expect(nameErrors).toHaveLength(0);
  });

  it('cenário 05 — name com 101 caracteres gera erro MaxLength', async () => {
    const errors = await validateDto({ ...valid, name: 'A'.repeat(101) });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  // ── email ───────────────────────────────────────────────────────────────
  it('cenário 06 — e-mail sem @ gera erro IsEmail', async () => {
    const errors = await validateDto({ ...valid, email: 'invalido-sem-arroba' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('cenário 07 — e-mail sem domínio gera erro IsEmail', async () => {
    const errors = await validateDto({ ...valid, email: 'alice@' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('cenário 08 — e-mail vazio gera erro IsNotEmpty', async () => {
    const errors = await validateDto({ ...valid, email: '' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('cenário 09 — e-mail ausente gera erro de validação', async () => {
    const { email: _, ...without } = valid;
    const errors = await validateDto(without);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('cenário 10 — e-mail com subdomínio é válido', async () => {
    const errors = await validateDto({ ...valid, email: 'alice@mail.tester.com' });
    expect(errors.some((e) => e.property === 'email')).toBe(false);
  });

  // ── password ────────────────────────────────────────────────────────────
  it('cenário 11 — password com 7 chars gera erro MinLength', async () => {
    const errors = await validateDto({ ...valid, password: '1234567' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('cenário 12 — password com 8 chars é válida (limite exato)', async () => {
    const errors = await validateDto({ ...valid, password: '12345678' });
    expect(errors.some((e) => e.property === 'password')).toBe(false);
  });

  it('cenário 13 — password vazia gera erro IsNotEmpty', async () => {
    const errors = await validateDto({ ...valid, password: '' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('cenário 14 — password ausente gera erro de validação', async () => {
    const { password: _, ...without } = valid;
    const errors = await validateDto(without);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('cenário 15 — DTO com todos os campos inválidos acumula múltiplos erros', async () => {
    const errors = await validateDto({ name: '', email: 'x', password: '123' });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
