import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpRequestService } from './http-request.service';
import { shareReplay, tap } from 'rxjs/operators'
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http:  HttpClient,
     private httpRequest: HttpRequestService, private router: Router) { } 

  login(email: string, password: string) {
    return this.httpRequest.login(email, password).pipe(
      // we use shareReplay cuz we dont want to run login method miltuple times
      shareReplay(),
      tap((res: HttpResponse<any> ) => {
      // tap() never change the content of the response like map() 
        // the auth tokens will be in the header of this response
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
        console.log('logged in');
        console.log(res);
      })
    )
  }

  signup(email:string, password: string) {
    return this.httpRequest.signup(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
        console.log('signup successfully now login');
        
      })
    )
  }

  getAccessToken() {
    return localStorage.getItem('x-access-token') ;
  }
  
  getRefreshToken() {
    return localStorage.getItem('x-refresh-token') ;
  }

  getUserId() {
    return localStorage.getItem('user-id') ;
  }

  setAccessToken(accessToken: string) {
    return localStorage.setItem('x-access-token', accessToken) ;
  }

  logOut() {
    this.removetSession();
    this.router.navigate(['/login'])
  }
 private setSession(userId: string, accessToken: string, refreshToken: string) {
  localStorage.setItem('user-id', userId);
  localStorage.setItem('x-access-token', accessToken);
  localStorage.setItem('x-refresh-token', refreshToken);
 }

 private removetSession() {
  localStorage.removeItem('user-id');
  localStorage.removeItem('x-access-token');
  localStorage.removeItem('x-refresh-token');
 }

getNewAccessToken() {
  return this.http.get(`${this.httpRequest.PORT_URL}/users/me/access-token`, {
    headers: {
      'x-refresh-token': this.getRefreshToken(),
      '_id': this.getUserId()
    },
// special key observe : can return the whole info in the response with headers  or just the body 
 // observe: 'body' or the observe: 'event' that return the type - like 0 for sended request 
    observe: 'response'
  }).pipe( 
    tap((res: HttpResponse<any>) => {
      this.setAccessToken(res.headers.get('x-access-token'))
    })
    )
}

}
