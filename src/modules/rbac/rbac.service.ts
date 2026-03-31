import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CognitoUserModelName,
  PageModelName,
  RoleModelName,
} from '../../database/schemas';

@Injectable()
export class RbacService {
  constructor(
    @InjectModel(RoleModelName) private readonly roleModel: Model<any>,
    @InjectModel(PageModelName) private readonly pageModel: Model<any>,
    @InjectModel(CognitoUserModelName) private readonly userModel: Model<any>,
  ) {}

  async createRole(body: any) {
    const { name, features = [], isActive = true } = body;
    if (!name) throw new BadRequestException('Name is required');

    const exists = await this.roleModel.findOne({ name });
    if (exists) throw new BadRequestException('Rolename already exists');

    return this.roleModel.create({ name, features, isActive });
  }

  async updateRole(body: any) {
    const { roleId, name, features, isActive = true } = body;
    if (!roleId) throw new BadRequestException('Role Id is required');
    if (!name) throw new BadRequestException('Name is required');

    const existingRole = await this.roleModel.findOne({ _id: roleId });
    if (!existingRole) throw new NotFoundException('Role does not exist');

    const roleWithSameName = await this.roleModel.findOne({
      name,
      _id: { $ne: roleId },
    });
    if (roleWithSameName) {
      throw new BadRequestException('Rolename already exists');
    }

    return this.roleModel.findOneAndUpdate(
      { _id: roleId },
      { name, features, isActive, modifiedOn: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  getRoles() {
    return this.roleModel.find({});
  }

  async deleteRole(roleId?: string) {
    const role = await this.roleModel.findOne({ _id: roleId });
    if (!role) throw new NotFoundException("Role doesn't exists!");

    const userExists = await this.userModel.findOne({
      roleId: role?._id?.toString(),
    });
    if (userExists) {
      throw new BadRequestException("Can't delete role, it has users associated!");
    }

    return this.roleModel.deleteOne({ _id: roleId });
  }

  async createPage(body: any) {
    const { pageName, features = [], isActive = true } = body;
    if (!pageName) throw new BadRequestException('Page name is required');

    const existingPage = await this.pageModel.findOne({ pageName });
    if (existingPage) {
      throw new BadRequestException('Page name already exists');
    }

    return this.pageModel.create({ pageName, features, isActive });
  }

  async updatePage(body: any) {
    const { pageId, pageName, features, isActive = true } = body;
    if (!pageId) throw new BadRequestException('Missing pageId');
    if (!pageName || !features) {
      throw new BadRequestException('Missing name or features');
    }

    const existingPage = await this.pageModel.findOne({ _id: pageId });
    if (!existingPage) throw new NotFoundException('Page does not exists');

    const existingPageName = await this.pageModel.findOne({
      pageName,
      _id: { $ne: pageId },
    });
    if (existingPageName) {
      throw new BadRequestException('Page name already exists');
    }

    return this.pageModel.findOneAndUpdate(
      { _id: pageId },
      { pageName, isActive, features, modifiedOn: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  getPages() {
    return this.pageModel.find({});
  }

  getUsers() {
    return this.userModel.find({});
  }

  async updateUserRole(body: any) {
    const { userId, roleName, roleId } = body;
    if (!userId || !roleName || !roleId) {
      throw new BadRequestException(`Invalid Data, Can't update role`);
    }

    const existingUser = await this.userModel.findOne({ userId });
    if (!existingUser) throw new NotFoundException(`User doesn't exist`);

    return this.userModel.findOneAndUpdate(
      { userId },
      { roleName, roleId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async getUserPermissions(email?: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (!existingUser) throw new NotFoundException(`User doesn't exist`);

    const roleData = await this.roleModel.findOne({ name: existingUser?.roleName });
    return { userPermssions: roleData?.features, roleName: roleData?.name };
  }

  async handleCognitoUsers(userAttributes: any) {
    const identitiesStr = userAttributes?.identities;

    let providerName = 'Cognito';
    if (identitiesStr) {
      try {
        const identities = JSON.parse(identitiesStr);
        providerName = identities[0]?.providerName || 'Cognito';
      } catch {
        providerName = 'Cognito';
      }
    }

    if (providerName !== 'TransformCX') {
      return null;
    }

    const userData = {
      userId: userAttributes.sub || userAttributes.user_id,
      email: userAttributes.email,
      name: userAttributes.name,
      provider: providerName,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    const existing = await this.userModel.findOne({ userId: userData.userId });
    if (existing) {
      return this.userModel.findOneAndUpdate(
        { userId: userData.userId },
        { lastLogin: new Date() },
        { new: true },
      );
    }

    return this.userModel.create(userData);
  }
}
