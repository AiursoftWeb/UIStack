using Microsoft.AspNetCore.Mvc;

namespace Aiursoft.UiStack.Demo.Controllers;

[Route("files")]
public class FilesController : Controller
{
    [HttpPost("upload")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> Upload()
    {
        if (HttpContext.Request.Form.Files.Count < 1)
            return BadRequest("No file uploaded.");

        var file = HttpContext.Request.Form.Files.First();
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("Only image files are allowed.");

        var uploadsDir = Path.Combine(Path.GetTempPath(), "uistack-demo-uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return Ok(new { internetPath = $"/files/download/{fileName}" });
    }

    [HttpGet("download/{fileName}")]
    public IActionResult Download(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || fileName.Contains("..") || fileName.Contains('/') || fileName.Contains('\\'))
            return BadRequest("Invalid file name.");

        var uploadsDir = Path.Combine(Path.GetTempPath(), "uistack-demo-uploads");
        var filePath = Path.GetFullPath(Path.Combine(uploadsDir, fileName));

        if (!filePath.StartsWith(Path.GetFullPath(uploadsDir) + Path.DirectorySeparatorChar))
            return BadRequest("Invalid file path.");

        if (!System.IO.File.Exists(filePath))
            return NotFound();

        var contentType = Path.GetExtension(fileName) switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        return PhysicalFile(filePath, contentType);
    }
}
