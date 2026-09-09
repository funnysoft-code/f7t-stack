<?php

declare(strict_types=1);
use App\Models\Users\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Password;
use Symfony\Component\Console\Tester\CommandTester;

// Opt-in proof against a disposable U12 source fixture. Prints metadata only.
$stage = 'bootstrap';
try {
    require getcwd().'/vendor/autoload.php';
    $app = require getcwd().'/bootstrap/app.php';
    $kernel = $app->make(Kernel::class);
    $kernel->bootstrap();
    if (! $app->environment('local') || ! str_starts_with((string) config('database.connections.pgsql.database'), 'f7t_u12_') || config('mail.default') !== 'smtp') {
        throw new RuntimeException('Use a dedicated initialized U12 fixture and Herd SMTP.');
    }
    $model = class_exists(User::class) ? User::class : Modules\Identity\Models\Users\User::class;
    $stage = 'first-user';
    if ($model::query()->exists() && ! in_array('--resume', $argv, true)) {
        throw new RuntimeException('This mail proof requires its own empty users table.');
    }
    $email = 'u12-'.bin2hex(random_bytes(8)).'@example.test';
    $password = bin2hex(random_bytes(24));
    $command = new CommandTester(Artisan::all()['funnysoft:create-first-user']);
    $command->setInputs([$password, $password]);
    $exit = $model::query()->exists() ? 0 : $command->execute(['--name' => 'U12 mail proof', '--email' => $email]);
    unset($password);
    $user = $model::query()->sole();
    $email = $user->email;
    if ($exit !== 0 || $user->name !== 'U12 mail proof' || ! str_starts_with($email, 'u12-') || $user->hasVerifiedEmail() || $user->getAllPermissions()->isNotEmpty()) {
        throw new RuntimeException('First-user provisioning contract failed.');
    }
    $repeat = new CommandTester(Artisan::all()['funnysoft:create-first-user']);
    if ($repeat->execute([]) === 0 || $model::query()->count() !== 1) {
        throw new RuntimeException('Repeated first-user command did not refuse.');
    }
    $stage = 'reset-delivery';
    $status = Password::sendResetLink(['email' => $email]);
    if ($status !== Password::RESET_LINK_SENT && ! ($status === Password::RESET_THROTTLED && in_array('--resume', $argv, true))) {
        throw new RuntimeException('Reset notification delivery failed.');
    }
    $stage = 'mail-retrieval';
    $file = getenv('HOME').'/Library/Application Support/Herd/HerdCoreData.sqlite';
    $mail = new PDO('sqlite:file:'.$file.'?mode=ro');
    $query = $mail->prepare('SELECT m.ZMAILBOX, m.ZSUBJECT, m.ZHTML FROM ZCDMAIL m JOIN ZCDMAILADDRESS a ON a.ZMAIL=m.Z_PK WHERE a.ZADDRESS=?');
    $rows = [];
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $query->execute([$email]);
        $rows = $query->fetchAll(PDO::FETCH_ASSOC);
        if (count($rows) >= 2) {
            break;
        }
        usleep(100000);
    }
    $verification = false;
    $reset = false;
    $mailbox = (string) config('mail.mailers.smtp.username');
    foreach ($rows as $row) {
        if ($row['ZMAILBOX'] !== $mailbox) {
            throw new RuntimeException('Mail was not grouped in the named Herd mailbox.');
        }
        $verification = $verification || ($row['ZSUBJECT'] === 'Verify your email address' && (str_contains($row['ZHTML'], '/verify/') || str_contains($row['ZHTML'], '/verify-email?verification_url=')));
        $reset = $reset || ($row['ZSUBJECT'] === 'Reset your password' && (str_contains($row['ZHTML'], '/reset-password/') || str_contains($row['ZHTML'], '/reset-password?token=')));
    }
    if (! $verification || ! $reset) {
        throw new RuntimeException('Verification/reset messages with action links were not retrieved.');
    }
    echo json_encode(['mailbox' => $mailbox, 'verification_retrieved' => $verification, 'reset_retrieved' => $reset, 'unverified_ordinary_account' => true, 'repeat_refused' => true], JSON_PRETTY_PRINT).PHP_EOL;
} catch (Throwable) {
    fwrite(STDERR, "Live mail proof failed at {$stage}. Inspect the dedicated fixture and Herd mailbox locally.\n");
    exit(1);
}
