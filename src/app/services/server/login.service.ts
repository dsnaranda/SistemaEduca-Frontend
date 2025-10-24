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
}
