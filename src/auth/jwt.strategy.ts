import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy,ExtractJwt } from "passport-jwt";
// import { User } from "./entities/auth.entity";
import { Model } from "mongoose";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        // @InjectModel(User.name)
        // private userModel: Model<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                // Extract token from cookie
                (req) => {
                  const token = req?.cookies?.Authorization?.replace('Bearer ', '');
                  return token || null;
                },
                // Fallback: extract token from Authorization header
                ExtractJwt.fromAuthHeaderAsBearerToken(),
              ]),
            secretOrKey : process.env.TOKEN_SECRET
        })
    }

        async validate(payload) {
            const user = payload
            
            if(!user) {
                throw new UnauthorizedException('Login first to access this endpoint')
            }

            return user;
        }
    
}