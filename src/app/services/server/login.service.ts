import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

}
