import { Injectable } from '@nestjs/common';
import {
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoAwsService {
  private readonly client = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  private get userPoolId() {
    return process.env.COGNITO_USERPOOL_ID ?? '';
  }

  listCognitoUsers(paginationToken: string | null = null, limit = 60) {
    return this.client.send(
      new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit,
        PaginationToken: paginationToken ?? undefined,
      }),
    );
  }

  async getUserGroups(username: string) {
    try {
      const response = await this.client.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: this.userPoolId,
          Username: username,
        }),
      );

      return response.Groups?.map((group) => group.GroupName ?? '') ?? [];
    } catch {
      return [];
    }
  }

  filterUsersByProvider(users: any[], providerName: string) {
    return users.filter((user) => {
      const identitiesAttr = user.Attributes.find(
        (attribute: any) => attribute.Name === 'identities',
      );
      if (!identitiesAttr) return false;

      try {
        const identities = JSON.parse(identitiesAttr.Value);
        return identities[0]?.providerName === providerName;
      } catch {
        return false;
      }
    });
  }

  removeUserFromRole(username: string, role: string) {
    return this.client.send(
      new AdminRemoveUserFromGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: role,
      }),
    );
  }

  addUserToRole(username: string, newRole: string) {
    return this.client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: newRole,
      }),
    );
  }
}
