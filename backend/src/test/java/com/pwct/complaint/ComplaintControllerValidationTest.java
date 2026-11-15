package com.pwct.complaint;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.pwct.security.JwtAuthFilter;

@WebMvcTest(controllers = ComplaintController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthFilter.class))
@AutoConfigureMockMvc(addFilters = false)
class ComplaintControllerValidationTest {
    @Autowired MockMvc mvc;
    @MockBean ComplaintService complaintService;

    @Test
    void rejectsComplaintWithoutRequiredFields() throws Exception {
        mvc.perform(post("/api/complaints").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"\",\"location\":\"\",\"categoryId\":null}"))
                .andExpect(status().isBadRequest());
    }
}
