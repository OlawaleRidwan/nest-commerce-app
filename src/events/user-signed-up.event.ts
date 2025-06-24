// src/events/user-signed-up.event.ts
export class UserSignedUpEvent {
    constructor(
      public readonly email: string,
      public readonly message: string,
    ) {}
  }
  