using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel;
﻿using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ActiveLearningSystem.Controllers.InstructorController
{
    [Route("api/manager/[controller]")]
    [ApiController]
    public class ManageModuleController : ControllerBase
    {
        private readonly AlsContext _context;
        private readonly IModuleListService _moduleListService;

        public ManageModuleController(AlsContext context, IModuleListService moduleListService)
        {
            _context = context;
            _moduleListService = moduleListService;
        }

        [Authorize(Roles = "Instructor")]
        [HttpGet("course{courseId}/modules")]
        public ActionResult<List<ModuleManagerVM>> GetModulesByCourseId(int courseId)
        {
            var course = _context.Courses.FirstOrDefault(c => c.CourseId == courseId);

            if (course == null )
            {
                return NotFound("Không tồn tại khóa học này.");
            }

            var modules = _moduleListService.GetModulesByCourseId(courseId);

            if (modules == null || !modules.Any())
            {
                return NotFound("Không có mô-đun nào cho khóa học này.");
            }

            return Ok(modules);
        }

        [Authorize(Roles = "Instructor")]
        [HttpGet("module{moduleId}/details")]
        public ActionResult<ModuleDetailsManagerVM> GetModuleDetails(int moduleId)
        {
            var module = _moduleListService.GetModuleDetailsById(moduleId);

            if (module == null)
            {
                return NotFound($"Không tìm thấy mô-đun với ID = {moduleId}");
            }

            return Ok(module);
        }

        [Authorize(Roles = "Instructor")]
        [HttpPut("module{moduleId}/update")]
        public IActionResult UpdateModule(int moduleId, [FromBody] UpdateModuleVM model)
        {
            var updated = _moduleListService.UpdateModule(moduleId, model);

            if (!updated)
            {
                return NotFound($"Không tìm thấy mô-đun với ID = {moduleId}");
            }

            return Ok("Cập nhật mô-đun thành công.");
        }

        [Authorize(Roles = "Instructor")]
        [HttpPost("course{courseId}/add-module")]
        public IActionResult AddModuleToCourse(int courseId, [FromBody] CreateModuleVM model)
        {
            try
            {
                var success = _moduleListService.AddModuleToCourse(courseId, model);
                if (!success)
                    return NotFound("Khóa học không tồn tại.");

                return Ok("Thêm mô-đun thành công.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Instructor")]
        [HttpDelete("delete/{moduleId}")]
        public IActionResult DeleteModule(int moduleId)
        {
            try
            {
                _moduleListService.DeleteModule(moduleId);

                return Content($"Mô-đun đã được xóa thành công.");
            }
            catch (Exception ex)
            {
                return Content(ex.Message);
            }
        }


    }
}
