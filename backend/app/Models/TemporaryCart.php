namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids; // Tambahkan ini

class TemporaryCart extends Model
{
    use HasUuids; // Tambahkan ini agar 'id' otomatis jadi UUID

    protected $table = 'temporary_cart';
    protected $fillable = ['id', 'user_id', 'tools_id', 'qty'];
}