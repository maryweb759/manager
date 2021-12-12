import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {
  readonly PORT_URL;
  constructor(private http: HttpClient) { 
    this.PORT_URL = 'http://localhost:3000'; 
  } 

  get(url: string) {
   return this.http.get(`${this.PORT_URL}/${url}`)
  } 

  post(url: string, payload: Object) {
    return this.http.post(`${this.PORT_URL}/${url}`, payload)
  }

  patch(url: string, payload: Object) {
    return this.http.patch(`${this.PORT_URL}/${url}`, payload)
  }

  delete(url: string) {
    return this.http.delete(`${this.PORT_URL}/${url}`)
  }

  /******* auth methods  */ 

  login(email: string, password: string) {
    return this.http.post(`${this.PORT_URL}/users/login`, {
      email, 
      password
    }, { 
      observe: 'response'
    })
  } 

  signup(email: string, password: string) {
    return this.http.post(`${this.PORT_URL}/users`, {
      email, 
      password
    }, 
    {
      observe: 'response'
    })
  }

}
