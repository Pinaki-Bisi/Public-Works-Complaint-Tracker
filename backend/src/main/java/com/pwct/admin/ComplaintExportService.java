package com.pwct.admin;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Table;
import com.lowagie.text.Cell;
import com.lowagie.text.pdf.PdfWriter;
import com.pwct.common.ApiException;
import com.pwct.common.ComplaintStatus;
import com.pwct.common.Priority;
import com.pwct.complaint.ComplaintRepository;

@Service
public class ComplaintExportService {
    private final ComplaintRepository complaints;
    public ComplaintExportService(ComplaintRepository complaints) { this.complaints = complaints; }

    @Transactional(readOnly = true)
    public ExportFile export(String format, ComplaintStatus status, Priority priority, Long departmentId, String query,
            Instant fromDate, Instant toDate) {
        if (fromDate != null && toDate != null && !fromDate.isBefore(toDate))
            throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate must be earlier than toDate");
        var page = complaints.searchScoped(true, null, null, null, status, priority, null, departmentId,
                fromDate, toDate, query == null || query.isBlank() ? null : query.trim(),
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt")));
        try {
            if ("xlsx".equalsIgnoreCase(format)) return excel(page.getContent());
            if ("pdf".equalsIgnoreCase(format)) return pdf(page.getContent());
            throw new ApiException(HttpStatus.BAD_REQUEST, "format must be xlsx or pdf");
        } catch (ApiException ex) { throw ex; }
        catch (Exception ex) { throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate report"); }
    }

    private ExportFile excel(java.util.List<com.pwct.complaint.Complaint> rows) throws Exception {
        try (XSSFWorkbook book = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            var sheet = book.createSheet("Complaints");
            var headers = new String[]{"Ticket", "Title", "Location", "Department", "Category", "Status", "Priority", "Created", "Reporter"};
            var header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            int index = 1;
            for (var c : rows) {
                var row = sheet.createRow(index++);
                String[] data = {c.getTicketNo(), c.getTitle(), c.getLocation(), c.getCategory().getDepartment().getName(),
                        c.getCategory().getName(), c.getStatus().name(), c.getPriority().name(), c.getCreatedAt().toString(), c.getCreatedBy().getFullName()};
                for (int i = 0; i < data.length; i++) row.createCell(i).setCellValue(data[i]);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            book.write(out);
            return new ExportFile("complaints.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        }
    }

    private ExportFile pdf(java.util.List<com.pwct.complaint.Complaint> rows) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(); PdfWriter.getInstance(document, out); document.open();
            document.add(new Paragraph("Public Works Complaint Report — " + Instant.now()));
            Table table = new Table(7); table.setWidth(100);
            for (String title : new String[]{"Ticket", "Title", "Location", "Department", "Status", "Priority", "Created"}) table.addCell(new Cell(title));
            for (var c : rows) {
                table.addCell(new Cell(c.getTicketNo())); table.addCell(new Cell(c.getTitle()));
                table.addCell(new Cell(c.getLocation())); table.addCell(new Cell(c.getCategory().getDepartment().getName()));
                table.addCell(new Cell(c.getStatus().name())); table.addCell(new Cell(c.getPriority().name()));
                table.addCell(new Cell(c.getCreatedAt().toString()));
            }
            document.add(table); document.close();
            return new ExportFile("complaints.pdf", "application/pdf", out.toByteArray());
        }
    }

    public record ExportFile(String fileName, String contentType, byte[] bytes) { }
}
