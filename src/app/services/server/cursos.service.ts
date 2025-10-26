import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursosService {

  private readonly useLocal = false;
  private readonly baseUrl = this.useLocal
    ? 'http://localhost:3001'
    : 'https://api-sistema-escolar.vercel.app';

  constructor(private http: HttpClient) { }

  addCurso(data: any): Observable<any> {
    const url = `${this.baseUrl}/cursos/add`;
    return this.http.post<any>(url, data);
  }

  getCursosPorDocente(docenteId: string): Observable<any> {
    const url = `${this.baseUrl}/cursos/docente/${docenteId}`;
    return this.http.get<any>(url);
  }

  addMaterias(cursoId: string, materias: any[]): Observable<any> {
    const url = `${this.baseUrl}/materias/add`;
    const body = { curso_id: cursoId, materias };
    return this.http.post<any>(url, body);
  }

  addEstudiantes(cursoId: string, estudiantes: any[]): Observable<any> {
    const url = `${this.baseUrl}/usuarios/addestudiantes`;
    const body = { curso_id: cursoId, estudiantes };
    return this.http.post<any>(url, body);
  }

  getMateriasPorCurso(cursoId: string): Observable<any> {
    const url = `${this.baseUrl}/materias/curso/${cursoId}`;
    return this.http.get<any>(url);
  }

  getEstudiantesPorCurso(cursoId: string): Observable<any> {
    const url = `${this.baseUrl}/usuarios/curso/${cursoId}/estudiantes`;
    return this.http.get<any>(url);
  }

  registrarAsistencia(data: any): Observable<any> {
    const url = `${this.baseUrl}/asistencia/registrar`;
    return this.http.post<any>(url, data);
  }

}
