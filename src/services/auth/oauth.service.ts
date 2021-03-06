import { Injectable } from "@angular/core";
import { Platform } from "ionic-angular";
import { HTTP } from "@ionic-native/http";

import { AuthService } from "./auth.service";

@Injectable()
export class OAuthService {

    redirect_url = "https://staging.open-sunbird.org/oauth2callback";

    logout_url = "https://staging.open-sunbird.org/auth/realms/sunbird/protocol/openid-connect/logout?redirect_uri=https://staging.open-sunbird.org/oauth2callback";

    auth_url= "https://staging.open-sunbird.org/auth/realms/sunbird/protocol/openid-connect/auth?redirect_uri=${R}&response_type=code&scope=offline_access&client_id=${CID}";

    constructor(private platform: Platform, private http: HTTP, private authService: AuthService) {
        this.auth_url = this.auth_url.replace("${CID}", this.platform.is("android")?"android":"ios");
        this.auth_url = this.auth_url.replace("${R}", this.redirect_url);
    }

    doOAuthStepOne(): Promise<any> {
        let that = this;
        return new Promise(function(resolve, reject) {

            (<any>window).cordova.plugins.browsertab.isAvailable(function(result) {
                if (!result) {
                    let browserRef = (<any>window).cordova.InAppBrowser.open(that.auth_url);
                    browserRef.addEventListener("loadstart", (event) => {
                        if ((event.url).indexOf(that.redirect_url) === 0) {
                            browserRef.removeEventListener("exit", (event) => {});
                            browserRef.close();
                            let responseParameters = (((event.url).split("?")[1]).split("="))[1];
                            if (responseParameters !== undefined) {
                                resolve(responseParameters);
                            } else {
                                reject("Problem authenticating with Sunbird");
                            }
                        }
                    });
                    browserRef.addEventListener("exit", function(event) {
                        reject("The Sunbird sign in flow was canceled");
                    });
                } else {
                    // that.authService.oauthstepone(token => {
                    //     resolve(token);
                    // });
                    (<any>window).handleOpenURL = function (url) {
                        if ((url).indexOf(that.redirect_url) === 0) {
                            let responseParameters = (((url).split("?")[1]).split("="))[1];
                            if (responseParameters !== undefined) {
                                resolve(responseParameters);
                            } else {
                                reject("Problem authenticating with Sunbird");
                            }
                        }
                    };
                    (<any>window).cordova.plugins.browsertab.openUrl(
                        that.auth_url);
                }
              },
              function(isAvailableError) {
                let browserRef = (<any>window).cordova.InAppBrowser.open(that.auth_url);
                    browserRef.addEventListener("loadstart", (event) => {
                        if ((event.url).indexOf(that.redirect_url) === 0) {
                            browserRef.removeEventListener("exit", (event) => {});
                            browserRef.close();
                            let responseParameters = (((event.url).split("?")[1]).split("="))[1];
                            if (responseParameters !== undefined) {
                                resolve(responseParameters);
                            } else {
                                reject("Problem authenticating with Sunbird");
                            }
                        }
                    });
                    browserRef.addEventListener("exit", function(event) {
                        reject("The Sunbird sign in flow was canceled");
                    });
              });
            });
    }

    doOAuthStepTwo(token: string): Promise<any> {

        let that = this;

        return new Promise(function(resolve, reject) {
              that.authService.createSession(token,(response)=>{
                try {
                    let dataJson = JSON.parse(response);
                    let refreshToken = dataJson["refresh_token"];
                
                    let accessToken: string = dataJson["access_token"];

                    let value = accessToken.substring(accessToken.indexOf('.') + 1, accessToken.lastIndexOf('.'));
                    value = atob(value);
                    let json = JSON.parse(value);
                    let userToken = json["sub"];

                    that.authService.startSession(accessToken, refreshToken, userToken);

                    resolve();
                    
                } catch (error) {
                    reject(error);
                }
            },(error)=>{
                
            });
               
        });
    }

    doLogOut(): Promise<any> {
        let that = this;
        return new Promise(function (resolve, reject) {
            let browserRef = (<any>window).cordova.InAppBrowser.open(that.logout_url);
            browserRef.addEventListener("loadstart", (event) => {
                if ((event.url).indexOf(that.redirect_url) === 0) {
                    browserRef.removeEventListener("exit", (event) => {});
                    browserRef.close();
                    that.authService.endSession();
                    resolve();
                }
            });
        }) 
    }


}