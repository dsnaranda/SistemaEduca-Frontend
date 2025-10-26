import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly useLocal = false;
  private readonly baseUrl = this.useLocal
    ? 'http://localhost:3001'
    : 'https://api-sistema-escolar.vercel.app';


  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}/usuarios/login`;
    const body = { email, password };
    return this.http.post<any>(url, body);
  }

  verificarCorreo(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/usuarios/verificar-correo`, { email });
  }

  cambiarContrasena(id: string, password: string): Observable<any> {
    const url = `${this.baseUrl}/usuarios/cambiar-contrasena/${id}`;
    return this.http.put<any>(url, { password });
  }

  obtenerDocentes(): Observable<any[]> {
    const url = `${this.baseUrl}/usuarios/list`;
    return this.http.get<any[]>(url).pipe(
      map((usuarios: any[]) =>
        usuarios.filter((u: any) => u.rol === 'docente')
      )
    );
  }

  updateUsuario(id: string, data: any): Observable<any> {
    const url = `${this.baseUrl}/usuarios/${id}`;
    return this.http.put<any>(url, data);
  }
  
}
