import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Erro desconhecido';

      if (error.status === 0) {
        message = 'Sem conexão com o servidor. Verifique se o backend está rodando.';
      } else if (error.status === 400) {
        message = error.error?.message ?? 'Dados inválidos';
      } else if (error.status === 404) {
        message = 'Recurso não encontrado';
      } else if (error.status === 409) {
        message = error.error?.message ?? 'Conflito: recurso já existe';
      } else if (error.status >= 500) {
        message = 'Erro interno do servidor';
      }

      return throwError(() => ({ ...error, message }));
    }),
  );
};
