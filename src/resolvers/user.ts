import { User } from "../entities/User"
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";



@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, {nullable: true})
  async me(
    @Ctx() { req, em }: MyContext
  ) {
    // you are not logged in
    if (!req.session.userId) {2efds vgb
      return null
    }

    const user = await em.findOne(User, {id: req.session.userId});
    return user;
  }
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() {em}: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: "username",
          message: "length must be greater than 2"
        }]
      }
    };
    if (options.password.length <= 3) {
      return {
        errors: [{
          field: "password",
          message: "length must be greater than 3"
        }]
      }
    };
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword
    });
    try{
      await em.persistAndFlush(user);
    } catch(err) {
      if (err.code === "23505") { 
        return {
          errors: [{
            field: 'username',
            message: 'username already exists'
          }]
        }
      }
      console.log('message: ', err.message)
    }
    return {
      user,
    }
  
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() {em, req}: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOneOrFail(User, {username: options.username})
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "invalid login"
          }
        ]
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "invalid login"
          }
        ]
      }
    }

    req.session.userId = user.id;

    return {
      user
    }
  }
}
