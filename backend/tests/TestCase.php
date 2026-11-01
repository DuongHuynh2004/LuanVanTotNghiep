<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Keep normal OTP tests independent of the developer's temporary .env switch.
        config(['auth.email_verification_required' => true]);
    }
}
