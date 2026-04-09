<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

header('Content-Type: application/json');
echo json_encode(['status' => 'success']);die;
// Get POST data safely
$name        = trim($_POST['name'] ?? '');
$phone       = trim($_POST['phone'] ?? '');
$email       = trim($_POST['email'] ?? '');
$description = trim($_POST['description'] ?? '');

// Basic validation (VERY IMPORTANT)
if ($name == '' || $phone == '' || $email == '' || $description == '') {
    echo json_encode(['status' => 'error', 'msg' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'msg' => 'Invalid email']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // SMTP config (use your Outlook/domain email settings)
    $mail->isSMTP();
    $mail->Host       = 'smtp.office365.com'; // or your hosting SMTP
    $mail->SMTPAuth   = true;
    $mail->Username   = 'you@yourdomain.com'; // your email
    $mail->Password   = 'your-password';      // your password / app password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;

    // Sender
    $mail->setFrom('you@yourdomain.com', 'Website Contact');

    // Send to YOU (admin)
    $mail->addAddress('you@yourdomain.com');

    // Optional: Reply to user
    $mail->addReplyTo($email, $name);

    // Email content
    $mail->isHTML(true);
    $mail->Subject = 'New Contact Form Submission';

    $mail->Body = "
        <h3>New Enquiry</h3>
        <p><b>Name:</b> {$name}</p>
        <p><b>Phone:</b> {$phone}</p>
        <p><b>Email:</b> {$email}</p>
        <p><b>Description:</b><br>{$description}</p>
    ";

    $mail->AltBody = "Name: $name\nPhone: $phone\nEmail: $email\nMessage: $description";

    $mail->send();

    // ✅ Optional: Send THANK YOU email to user
    $mail->clearAddresses();
    $mail->addAddress($email, $name);

    $mail->Subject = "Thank You for Contacting Us";
    $mail->Body    = "Hi $name,<br><br>Thank you for reaching out. We will get back to you soon.";
    $mail->AltBody = "Hi $name, Thank you for contacting us.";

    $mail->send();

    echo json_encode(['status' => 'success']);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'msg' => $mail->ErrorInfo
    ]);
}