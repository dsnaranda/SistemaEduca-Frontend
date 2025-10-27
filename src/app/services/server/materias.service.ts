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

  getEstudiantesPorTrimestre(materiaId: string, numero: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/trimestres/verificar/${materiaId}/${numero}`);
  }

  enviarTarea(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/actividades/enviar-tarea`, data);
  }

  cerrarTrimestresPorMateria(materiaId: string, numero: number): Observable<any> {
    const body = { materia_id: materiaId, numero };
    return this.http.put<any>(`${this.baseUrl}/trimestres/cerrar-materia`, body);
  }

  getTrimestrePorId(trimestreId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/trimestres/${trimestreId}`);
  }

  calificarActividad(actividadId: string, nota: number): Observable<any> {
    const body = { nota };
    return this.http.put<any>(`${this.baseUrl}/actividades/calificar/${actividadId}`, body);
  }

  finalizarPromedios(cursoId: string) {
    const url = `${this.baseUrl}/cursos/finalizar-promedios`;
    return this.http.put(url, { curso_id: cursoId });
  }

  getCartillaCurso(cursoId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/cursos/${cursoId}/cartilla`);
  }

}
