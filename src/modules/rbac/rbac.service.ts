import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class RbacService {
  createRole(body: Record<string, unknown>) {
    return tcxResponse('rbac.createRole', {
      sourceLambdaModule: 'modules/rbac/index.mjs#createRole',
      requestBody: body,
    });
  }

  updateRole(body: Record<string, unknown>) {
    return tcxResponse('rbac.updateRole', {
      sourceLambdaModule: 'modules/rbac/index.mjs#updateRole',
      requestBody: body,
    });
  }

  deleteRole(roleId?: string) {
    return tcxResponse('rbac.deleteRole', {
      sourceLambdaModule: 'modules/rbac/index.mjs#deleteRole',
      roleId,
    });
  }

  getRoles() {
    return tcxResponse('rbac.getRoles', {
      sourceLambdaModule: 'modules/rbac/index.mjs#getRoles',
    });
  }

  createPage(body: Record<string, unknown>) {
    return tcxResponse('rbac.createPage', {
      sourceLambdaModule: 'modules/rbac/index.mjs#createPage',
      requestBody: body,
    });
  }

  updatePage(body: Record<string, unknown>) {
    return tcxResponse('rbac.updatePage', {
      sourceLambdaModule: 'modules/rbac/index.mjs#updatePage',
      requestBody: body,
    });
  }

  getPages() {
    return tcxResponse('rbac.getPages', {
      sourceLambdaModule: 'modules/rbac/index.mjs#getPages',
    });
  }

  getUsers() {
    return tcxResponse('rbac.getUsers', {
      sourceLambdaModule: 'modules/rbac/index.mjs#getAllUsers',
    });
  }

  updateUserRole(body: Record<string, unknown>) {
    return tcxResponse('rbac.updateUserRole', {
      sourceLambdaModule: 'modules/rbac/index.mjs#updateUserRole',
      requestBody: body,
    });
  }

  getUserPermissions(email?: string) {
    return tcxResponse('rbac.getUserPermissions', {
      sourceLambdaModule: 'modules/rbac/index.mjs#getUserPermissions',
      email,
    });
  }
}
