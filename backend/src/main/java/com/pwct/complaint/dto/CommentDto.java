package com.pwct.complaint.dto;

import java.time.Instant;

import com.pwct.complaint.Comment;

public record CommentDto(Long id, String body, String authorName, Instant createdAt) {
    public static CommentDto from(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getBody(),
                comment.getAuthor().getFullName(),
                comment.getCreatedAt()
        );
    }
}
