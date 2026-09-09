<?php

declare(strict_types=1);

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return [
    'models' => ['permission' => Permission::class, 'role' => Role::class],
    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',
        'role_has_permissions' => 'role_has_permissions',
    ],
    'column_names' => ['role_pivot_key' => null, 'permission_pivot_key' => null, 'model_morph_key' => 'model_id', 'team_foreign_key' => 'team_id'],
    'teams' => false,
    'enable_wildcard_permission' => false,
    'register_permission_check_method' => true,
    'register_octane_reset_listener' => true,
    'events_enabled' => false,
    'display_permission_in_exception' => false,
    'display_role_in_exception' => false,
    'cache' => ['expiration_time' => new DateInterval('PT24H'), 'key' => 'spatie.permission.cache', 'store' => 'default'],
];
