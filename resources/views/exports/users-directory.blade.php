<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Users Directory</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            margin: 24px;
        }
        h1 {
            font-size: 22px;
            margin: 0 0 6px;
        }
        .meta {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 18px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            vertical-align: top;
        }
        th {
            font-size: 11px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.04em;
        }
        .status {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Users Directory</h1>
    <div class="meta">Generated {{ $generatedAt->format('F j, Y g:i A') }}</div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($users as $user)
                <tr>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->roles->first()?->name ?? 'No role' }}</td>
                    <td>{{ $user->program?->name ?? 'No department' }}</td>
                    <td class="status">{{ $user->is_active ? 'Active' : 'Inactive' }}</td>
                    <td>{{ optional($user->created_at)->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
