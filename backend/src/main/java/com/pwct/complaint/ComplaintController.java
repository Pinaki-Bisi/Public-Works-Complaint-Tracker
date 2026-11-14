package com.pwct.complaint;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pwct.common.ComplaintStatus;
import com.pwct.complaint.dto.AssignRequest;
import com.pwct.complaint.dto.CategoryDto;
import com.pwct.complaint.dto.CommentDto;
import com.pwct.complaint.dto.CommentRequest;
import com.pwct.complaint.dto.ComplaintDto;
import com.pwct.complaint.dto.CreateComplaintRequest;
import com.pwct.complaint.dto.StatusUpdateRequest;
import com.pwct.user.UserDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return complaintService.categories();
    }

    @PostMapping("/complaints")
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintDto create(Authentication authentication, @Valid @RequestBody CreateComplaintRequest request) {
        return complaintService.create(authentication.getName(), request);
    }

    @GetMapping("/complaints")
    public List<ComplaintDto> list(
            Authentication authentication,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId
    ) {
        return complaintService.list(authentication.getName(), status, categoryId, departmentId);
    }

    @GetMapping("/complaints/{id}")
    public ComplaintDto get(Authentication authentication, @PathVariable Long id) {
        return complaintService.get(authentication.getName(), id);
    }

    @PatchMapping("/complaints/{id}/status")
    public ComplaintDto status(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return complaintService.updateStatus(authentication.getName(), id, request);
    }

    @PostMapping("/complaints/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto comment(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request
    ) {
        return complaintService.addComment(authentication.getName(), id, request);
    }

    @PostMapping("/complaints/{id}/assign")
    public ComplaintDto assign(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request
    ) {
        return complaintService.assign(authentication.getName(), id, request);
    }

    @GetMapping("/crew")
    public List<UserDto> crew(Authentication authentication) {
        return complaintService.crewOptions(authentication.getName());
    }
}
