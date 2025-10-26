import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MateriasService {
  private readonly useLocal = false;
  private readonly baseUrl = this.useLocal
    ? 'http://localhost:3001'
    : 'https://api-sistema-escolar.vercel.app';


  constructor(private http: HttpClient) { }

  getTrimestresPorMateria(materiaId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/trimestres/verificar/materia/${materiaId}`);
  }

  crearTrimestresPorMateria(materiaId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/trimestres/crearPorMateria`, { materia_id: materiaId });
  }

}
